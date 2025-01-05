import { useRouter } from 'next/router';
import { useState } from 'react';

const SimilarQueries = ({ currentContent }) => { // Add searchInputRef as a prop
  const router = useRouter();
  const [loading, setLoading] = useState(false);


  const handleQueryClick = async (query) => {
    const prompt = query.similar_query;
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

  if (loading) {
    return <p>Redirecting...</p>;
  }

  return (
    <div>
      <div className="similar-queries">
        {currentContent.map((query, index) => (
          <a key={index} onClick={() => handleQueryClick(query)}>
            <h5>{query.similar_query}</h5>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SimilarQueries;