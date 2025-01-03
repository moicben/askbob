import { useState } from 'react';
import { useRouter } from 'next/router';

const Header = ({ setResult }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <header>
      <a href='/' className='logo'>bob</a>
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something to Bob..."
        className="search-input"
      />
      <button type="submit" disabled={loading || !prompt} className="search-button">
        {loading ? 'Thinking...' : <i className="fas fa-arrow-right arrow-icon"></i>}
      </button>
    </form>
    </header>
  );
};

export default Header;