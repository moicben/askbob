import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const SimilarQueries = ({ content }) => {
  const [similarQueries, setSimilarQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSimilarQueries = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/render?similar=${content}`);
        const data = await response.json();

        if (response.ok) {
          setSimilarQueries(data);
        } else {
          console.error('Error fetching similar queries:', data.error);
        }
      } catch (error) {
        console.error('Error fetching similar queries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarQueries();
  }, [content]);

  const handleQueryClick = (query) => {
    router.push(`/${query.similar_slug}`);
  };

  return (
    <div >
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="similar-queries">
          {similarQueries.map((query, index) => (
            <a key={index} onClick={() => handleQueryClick(query)}>
              <h5>{query.similar_query}</h5>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarQueries;