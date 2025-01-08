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
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.replace(/`/g, '').replace(/html/g, '').replace(/"/g, '').trim();
}

async function generateBody(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0.2,
    presence_penalty: 0.5,
  });
  return response.choices[0].message.content.replace(/`/g, '').replace(/html/g, '').replace(/"/g, '').trim();
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
   Write an SEO-optimized structured response in HTML for the search query: '${request_content}'. 

Follow these rules exactly:

1. **HTML-Only Structure**:
   - Do not include '<html>', '<head>', or '<body>'.
   - Use only these tags: <h1>, <h4>, <h2>, <h3>, <p>, <ul>, <ol>, <table>.

2. **Title (H1)**:
   - Must include '${request_content}'.
   - Make it engaging and attention-grabbing.

3. **Introduction (H4)**:
   - Explain why '${request_content}' is important or interesting.
   - Include at least one <p> paragraph.

4. **Main Sections (H2)**:
   - Each <h2> must include relevant keywords.
   - All supporting text within <p> tags.

5. **Sub-sections (H3)**:
   - Use sparingly for complex points.
   - All supporting text within <p> tags.

6. **Lists & Tables**:
   - Use <ul>/<ol> sparingly for added value.
   - Use <table> only if it meaningfully enriches data or comparisons.

7. **Conclusion (H4)**:
   - Summarize main points and include a CTA.
   - Use at least one <p> paragraph.

8. **Length & Style**:
   - 600–1000 words.
   - Professional, engaging, informative.
   - Must be written in the same language as '${request_content}'.

Return only the HTML code (no instructions, comments, or extra text).

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
        const generatedContentPromise = generateBody(requestPrompt)
         //console.log('Generated content:', generatedContentPromise); // Log the generated content

        // Generate SEO title and description
        const [seoTitle, seoDesc] = await Promise.all([
          generateCompletion(`Generate a SEO title of maximum 65 characters for: ${request_content}`),
          generateCompletion(`Generate a very attractive SEO description for: ${request_content}`)
        ]);

        // Generate FAQ titles in parallel
        const [content_faq1, content_faq2, content_faq3, content_faq4] = await Promise.all([
          generateCompletion(`Generate a "What" relevant question based on the following content: ${request_content}`),
          generateCompletion(`Generate a "Why" another relevant question based on the following content: ${request_content}`),
          generateCompletion(`Generate a "How" relevant question based on the following content: ${request_content}`),
          generateCompletion(`Generate a "When" relevant question based on the following content: ${request_content}`)
        ]);

        // Generate similar search queries
        const [similar_query1, similar_query2, similar_query3, similar_query4, similar_query5, similar_query6] = await Promise.all([
          generateCompletion(`Generate a similar search query for: ${request_content}`),
          generateCompletion(`Generate one "How" to" to similar search query for: ${request_content}`),
          generateCompletion(`Generate one "Why" search query for: ${request_content}`),
          generateCompletion(`Generate one "What" similar search query for: ${request_content}`),
          generateCompletion(`Generate one "Comparaison" short search query for: ${request_content}`),
          generateCompletion(`Generate one very different search query for: ${request_content}`),
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
          { similar_content: request_content, similar_query: similar_query1.replace(/['"]/g, ''), similar_slug: similar_query1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query2.replace(/['"]/g, ''), similar_slug: similar_query2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query3.replace(/['"]/g, ''), similar_slug: similar_query3.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query4.replace(/['"]/g, ''), similar_slug: similar_query4.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query5.replace(/['"]/g, ''), similar_slug: similar_query5.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
          { similar_content: request_content, similar_query: similar_query6.replace(/['"]/g, ''), similar_slug: similar_query6.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
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

              // Get a higher resolution image
              const updatedLocalImg = local_img ? local_img.replace('w=80', 'w=1280').replace('h=92', 'h=720') : null;

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
                  local_img: updatedLocalImg,
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