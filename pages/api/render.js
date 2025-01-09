import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
//import { getAnalytics } from '@vercel/analytics';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

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
  return response.choices[0].message.content.trim();
}

async function fetchLocals(content) {
  const { data: localsData, error: localsError } = await supabase
    .from('locals')
    .select('*')
    .eq('local_slug', content);

  if (localsError) {
    throw new Error('Error fetching locals');
  }

  // Sort localsData to ensure locals with non-null local_img are first
  const sortedLocalsData = localsData.sort((a, b) => {
    if (a.local_img && !b.local_img) return -1;
    if (!a.local_img && b.local_img) return 1;
    return 0;
  });

  return sortedLocalsData;
}

export default async function handler(req, res) {
  const { content, faq, profil, user } = req.query;

  if (content) {
    console.log("CONTENT : ", content);

    let localsData;
    try {
      localsData = await new Promise((resolve, reject) => {
        let attempts = 0;
        const intervalId = setInterval(async () => {
          try {
            const data = await fetchLocals(content);
            attempts++;
            if (data.length >= 3 || attempts >= 4) {
              clearInterval(intervalId);
              resolve(data);
            }
          } catch (error) {
            clearInterval(intervalId);
            reject(error);
          }
        }, 500);
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching locals' });
    }

    console.log("DATA LOCALS : ", localsData);

    // Get the main content 
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .select('*')
      .eq('content_slug', content)
      .single();

    if (contentError || !contentData) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get the FAQs
    const { data: faqsData, error: faqsError } = await supabase
      .from('faqs')
      .select('*')
      .eq('faq_content', contentData.content_request);

    if (faqsError) {
      return res.status(500).json({ error: 'Error fetching FAQs' });
    }

    // Get the similar queries
    const { data: similarsData, error: similarsError } = await supabase
      .from('similars')
      .select('*')
      .eq('similar_content', contentData.content_request);

    if (similarsError) {
      return res.status(500).json({ error: 'Error fetching similar queries' });
    }

    return res.status(200).json({ locals: localsData, ...contentData, faqs: faqsData, similars: similarsData });
  }

  // Get the FAQ body of clicked one
  if (faq) {
    let { data: faqData, error: faqError } = await supabase
      .from('faqs')
      .select('faq_body')
      .eq('faq_title', faq)
      .single();

    if (faqError) {
      return res.status(500).json({ error: 'Error fetching FAQ' });
    }

    if (!faqData || !faqData.faq_body) {
      // Generate the FAQ body using OpenAI if not present
      const faqBody = await generateCompletion(`Generate a short and direct answer for the following question: ${faq}`);

      // Update the FAQ in the database with the generated body
      const { data: updatedFaqData, error: updateError } = await supabase
        .from('faqs')
        .update({ faq_body: faqBody })
        .eq('faq_title', faq)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Error updating FAQ body' });
      }

      faqData = updatedFaqData;
    }

    return res.status(200).json(faqData);
  }

  if (profil) {
    let { data: profilData, error: profilError } = await supabase
      .from('profils')
      .select('*')
      .eq('profil_slug', profil)
      .single();

    if (profilError) {
      return res.status(500).json({ error: 'Error fetching profil' });
    }

    return res.status(200).json(profilData);
  }

  // Handle user submission
  if (user) {
    const { user_request, user_email } = req.body;

    console.log("LLLLLLLLLLLLLLuser REQUEST : ", user_request);
    console.log("LLLLLLLLLLLLLLuser EMAIL : ", user_email);

    if (!user_request || !user_email) {
      return res.status(400).json({ error: 'Missing user_request or user_email' });
    }
    

    try {
      // Fetch Vercel Analytics data
      //const analyticsData = await getAnalytics();

      // Insert user data along with analytics and speed insights data into Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          user_request,
          user_email,
        }]);

      if (userError) {
        console.error('Error inserting user:', userError);
        return res.status(500).json({ error: 'Error inserting user' });
      }

      return res.status(200).json({ message: 'user submitted successfully', user: userData });
    } catch (error) {
      console.error('Error fetching Vercel data or inserting user:', error);
      return res.status(500).json({ error: 'Error fetching Vercel data or inserting user' });
    }
  }

  return res.status(400).json({ error: 'Content, FAQ, Locals, Similar, or user is required' });
}