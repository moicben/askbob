import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
}

export default async function handler(req, res) {
  const { content, faq, locals, similar } = req.query;

  if (content) {
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .select('*')
      .eq('content_slug', content)
      .single();

    if (contentError || !contentData) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const { data: faqsData, error: faqsError } = await supabase
      .from('faqs')
      .select('*')
      .eq('faq_content', contentData.content_request);

    if (faqsError) {
      return res.status(500).json({ error: 'Error fetching FAQs' });
    }

    return res.status(200).json({ ...contentData, faqs: faqsData });
  }

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
      const faqBody = await generateCompletion(`Generate a short and direct answer for the following question: ${faq}`);

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

  if (locals) {
    const { data: localsData, error: localsError } = await supabase
      .from('locals')
      .select('*')
      .eq('local_slug', locals);

    if (localsError) {
      return res.status(500).json({ error: 'Error fetching locals' });
    }

    return res.status(200).json(localsData);
  }

  if (similar) {
    const { data: similarData, error: similarError } = await supabase
      .from('similars')
      .select('*')
      .eq('similar_content', similar);

    if (similarError) {
      return res.status(500).json({ error: 'Error fetching similar queries' });
    }

    return res.status(200).json(similarData);
  }

  return res.status(400).json({ error: 'Content, FAQ, Locals, or Similar is required' });
}