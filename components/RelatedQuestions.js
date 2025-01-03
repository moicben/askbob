import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const RelatedQuestions = ({ setResult, currentContent }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [faqLoading, setFaqLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const router = useRouter();

  const handleSearch = async (prompt) => {
    setLoading(true);
    try {
      // Enregistrer la recherche dans Supabase et obtenir le slug
      const saveResponse = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_content: prompt }),
      });
      const saveData = await saveResponse.json();

      // Rediriger vers la page de contenu
      router.push(`/${saveData.slug}`);
    } catch (error) {
      console.error('Error:', error); // Log the error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleSearch(prompt);
  };

  const fetchFaqBody = async (faq, index) => {
    setFaqLoading(true);
    try {
      const response = await fetch(`/api/render?faq=${faq.faq_title}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedFaq({ ...faq, faq_body: data.faq_body });
        setOpenFaqIndex(index);
      } else {
        console.error('Error fetching FAQ body:', data.error);
      }
    } catch (error) {
      console.error('Error fetching FAQ body:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  return (
    <div className='related-questions'>
      <h3>Related questions</h3>

        {currentContent.faqs && currentContent.faqs.map((faq, index) => (
          <h4 key={index}>
            <div onClick={() => fetchFaqBody(faq, index)}>
              {faq.faq_title}
            </div>
            {openFaqIndex === index && (
              <p className='faq-body'>
                {faqLoading ? <p>Loading FAQ...</p> : <p>{selectedFaq?.faq_body}</p>}
              </p>
            )}
          </h4>
        ))}

    </div>
  );
};

export default RelatedQuestions;