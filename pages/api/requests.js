import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import request from 'request';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
  throw new Error('The SUPABASE_URL, SUPABASE_KEY, or OPENAI_API_KEY environment variable is missing or empty.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Helper function to generate OpenAI completions
async function generateCompletion(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
}

async function generateBody(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0.2,
    presence_penalty: 0.5,
  });
  return response.choices[0].message.content.trim();
}

// Helper function to generate sitemap
async function generateSitemap() {
  const { data: contents, error } = await supabase
    .from('contents')
    .select('content_slug, content_created_at');

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${contents.map(content => `
    <url>
      <loc>${process.env.NEXT_PUBLIC_API_URL}/${content.content_slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
      <lastmod>${content.content_created_at}</lastmod>
    </url>`).join('')}
</urlset>`;

  return sitemap;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { request_content } = req.body;

    const requestPrompt = `
   Write an SEO-optimized article structured in HTML on the following topic: '${request_content}'. Ensure you follow the **strict formatting rules** and the requirements below:

### **Strict Formatting Rules**:
1. Write only the HTML content. Do not include any '<html>', '<head>', or '<body>' tags.
2. Do not include instructions, comments, or any additional information outside of the requested content.
3. Strictly use the following HTML tags for structure:
   - '<h1>': For the main title of the article.
   - '<h4>': For the introduction and conclusion.
   - '<h2>': For the main sections, optimized for SEO with targeted keywords related to '${request_content}'.
   - '<h3>': For sub-sections (use sparingly and only when necessary to elaborate on complex points).
   - '<p>': **Every paragraph must be encapsulated within a '<p>' tag.**
   - '<ul>' and '<ol>': For bullet or numbered lists.
   - '<table>': Include only if it meaningfully enriches the content with data or comparisons.

### **Content Requirements**:
1. **Main Title (H1)**:
   - Create an engaging and descriptive title encapsulated in an '<h1>' tag.
   - The title must include the search term '${request_content}' and be attention-grabbing.

2. **Introduction (H4)**:
   - Provide an engaging and concise introduction encapsulated in an '<h4>' tag.
   - Explain briefly why '${request_content}' is an important or interesting topic.
   - **Include at least one paragraph within '<p>' tags** to elaborate.

3. **Main Sections (H2)**:
   - Structure the article with '<h2>' tags, ensuring each one is optimized for SEO by incorporating relevant, long-tail keywords.
   - Include supporting content for each section, and ensure **all paragraphs are encapsulated in '<p>' tags.**
   - Examples:
     - '<h2>1. Why Hiring a Freelance Web Developer is the Smartest Choice</h2>'
     - '<p>Freelance developers offer flexibility...</p>'

4. **Sub-sections (H3)**:
   - Use '<h3>' tags sparingly, only for breaking down key details or adding clarity to a complex point.
   - Ensure supporting paragraphs are enclosed in '<p>' tags.

5. **Lists and Tables**:
   - Integrate bullet lists '<ul>' or numbered lists '<ol>' sparingly, ensuring they add value to the section.
   - Include an HTML '<table>' only if it enriches the content meaningfully, such as by comparing key data points.

6. **Conclusion (H4)**:
   - Summarize the article's key points with an engaging '<h4>' conclusion.
   - Include supporting content in a '<p>' tag and finish with a call-to-action (CTA).

7. **Variable Length**:
   - The article should be between **600 and 1000 words**, depending on the complexity of '${request_content}'.

### **Editorial Style**:
1. Maintain a professional, engaging, and informative tone.
2. Ensure all headings and content directly address the search intent behind '${request_content}'.
3. Avoid unnecessary repetition and diversify sentence structures to keep the content engaging.

### **Language Requirement**:
- The article must ALWAYS be written in the language of the request or search term '${request_content}'.

### **Summary of Expectations**:
- **Main Title (H1):** Optimized for SXO (click-worthy and keyword-rich).
- **Main Sections (H2):** SEO-optimized with relevant long-tail keywords, aligned with the search intent.
- **Paragraphs ('<p>'):** **Every block of text must be enclosed in '<p>' tags.**
- **Variable Length (600-1000 words):** Adjust based on topic complexity.
- Write ONLY the requested content, with no extraneous information.

    `;

    // Generate a slug from the request content
    const request_slug = request_content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      console.log('Request content:', request_content); // Log the request content

      // Check if the request_content already exists
      const { data: existingData, error: existingError } = await supabase
        .from('requests')
        .select('id, request_count')
        .eq('request_content', request_content)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Supabase error:', existingError); // Log the Supabase error
        throw existingError;
      }

      let data, error;

      if (existingData) {
        // If request_content exists, increment the request_count
        const newCount = existingData.request_count + 1;
        ({ data, error } = await supabase
          .from('requests')
          .update({ request_count: newCount })
          .eq('id', existingData.id));
      } else {
        // Generate content using OpenAI
        const generatedContentPromise = generateBody(requestPrompt);
        console.log('Generated content:', generatedContentPromise); // Log the generated content

        // Generate SEO title and description
        const [seoTitle, seoDesc] = await Promise.all([
          generateCompletion(`Generate a SEO title of maximum 65 characters for: ${request_content}`),
          generateCompletion(`Generate a very attractive SEO description for: ${request_content}`)
        ]);

        // Generate FAQ titles in parallel
        const [content_faq1, content_faq2, content_faq3, content_faq4] = await Promise.all([
          generateCompletion(`Generate a relevant question based on the following content: ${request_content}`),
          generateCompletion(`Generate a "What" relevant question based on the following content: ${request_content}`),
          generateCompletion(`Generate a "Why" another relevant question based on the following content: ${request_content}`),
          generateCompletion(`Generate a "How" relevant question based on the following content: ${request_content}`)
        ]);

        // Generate similar search queries
        const [similar_query1, similar_query2, similar_query3, similar_query4, similar_query5, similar_query6] = await Promise.all([
          generateCompletion(`Generate a similar search query for: ${request_content}`),
          generateCompletion(`Generate one "how to" to similar search query for: ${request_content}`),
          generateCompletion(`Generate one "why" search query for: ${request_content}`),
          generateCompletion(`Generate one additional similar search query for: ${request_content}`),
          generateCompletion(`Generate one "comparaison" search query for: ${request_content}`),
          generateCompletion(`Generate one different search query for: ${request_content}`),
        ]);


        // Insert a new record and save the content
        const generatedContent = await generatedContentPromise;
        ({ data, error } = await supabase
          .from('requests')
          .insert([{ request_content, request_slug, request_count: 1 }]));

        // Insert into the contents table
        const { data: contentData, error: contentError } = await supabase
          .from('contents')
          .insert([{
            content_request: request_content,
            content_slug: request_slug,
            content_body: generatedContent,
            content_title: seoTitle,
            content_desc: seoDesc
          }]);

        if (contentError) {
          console.error('Supabase content error:', contentError); // Log the Supabase content error
          throw contentError;
        }

        // Insert FAQs into the faqs table
        const faqs = [
          { faq_content: request_content, faq_title: content_faq1 },
          { faq_content: request_content, faq_title: content_faq2 },
          { faq_content: request_content, faq_title: content_faq3 },
          { faq_content: request_content, faq_title: content_faq4 }
        ];

        const { data: faqData, error: faqError } = await supabase
          .from('faqs')
          .insert(faqs);

        if (faqError) {
          console.error('Supabase FAQ error:', faqError); // Log the Supabase FAQ error
          throw faqError;
        }
        console.log('Supabase FAQ response data:', faqData); // Log the Supabase FAQ response data


        // Insert similar search queries into the similars table with slugsv
        const similars = [
          { similar_content: request_content, similar_query: similar_query1, similar_slug: similar_query1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query2, similar_slug: similar_query2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query3, similar_slug: similar_query3.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query4, similar_slug: similar_query4.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query5, similar_slug: similar_query5.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query6, similar_slug: similar_query6.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
        ];

        const { data: similarData, error: similarError } = await supabase
          .from('similars')
          .insert(similars);

        if (similarError) {
          console.error('Supabase similars error:', similarError); // Log the Supabase similars error
          throw similarError;
        }
        console.log('Supabase similars response data:', similarData); // Log the Supabase similars response data



        // Make the API call to Google and save the result in the googles table
        const options = {
          method: 'POST',
          url: 'https://google.serper.dev/maps',
          headers: {
            'X-API-KEY': 'ff3889fd01deef5ad34b504241ad3ddee7606463',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "q": request_content
          })
        };

        request(options, async (error, response) => {
          if (error) throw new Error(error);
          const googleData = JSON.parse(response.body);
          console.log('Google response data:', googleData); // Log the Google response data

          // Extract the places array from the response
          const placesResults = googleData.places;
          console.log('Places results:', placesResults); // Log the places results
          
          if (placesResults && Array.isArray(placesResults)) {
            // Iterate over the places array and insert each title into the locals table
            const insertPromises = placesResults.map((result, index) => {
              const {
                title: local_title,
                address: local_address,
                website: local_website,
                type: local_type,
                phoneNumber: local_phone,
                rating: local_rating,
                ratingCount: local_ratingCount,
                bookingLinks: local_booking,
                thumbnailUrl: local_img,
                position: local_position
              } = result;

              return supabase
                .from('locals')
                .insert([{
                  local_title,
                  local_address,
                  local_website,
                  local_request: request_content,
                  local_slug: request_slug,
                  local_type,
                  local_phone,
                  local_rating,
                  local_ratingCount,
                  local_booking,
                  local_img,
                  local_position
                }]);
            });

            try {
              const insertResults = await Promise.all(insertPromises);
              insertResults.forEach(({ data: localInsertData, error: localInsertError }) => {
                if (localInsertError) {
                  console.error('Supabase locals insert error:', localInsertError); // Log the Supabase locals insert error
                  throw localInsertError;
                }
                console.log('Supabase locals insert response data:', localInsertData); // Log the Supabase locals insert response data
              });
            } catch (insertError) {
              console.error('Error inserting into locals table:', insertError); // Log the error
              throw insertError;
            }
          } else {
            console.error('No places results found in the Google API response');
          }
        });
      }

      if (error) {
        console.error('Supabase error:', error); // Log the Supabase error
        throw error;
      }

      console.log('Supabase response data:', data); // Log the Supabase response data
      res.status(201).json({ message: 'Request saved successfully', slug: request_slug });
    } catch (error) {
      console.error('Error saving request:', error); // Log the error
      res.status(500).json({ error: 'Error saving request', details: error.message });
    }
  } else if (req.method === 'GET' && req.query.type === 'sitemap') {
    try {
      const sitemap = await generateSitemap();
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).json({ error: 'Error generating sitemap', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}