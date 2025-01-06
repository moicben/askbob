import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

import Head from 'next/head';
import Header from '../../components/Header';
import LocalSlider from '../../components/LocalSlider';
import SimilarQueries from '../../components/SimilarQueries';

export default function Profil() {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef(null); // Add this line

  useEffect(() => {
    if (!router.isReady) return;

    const fetchProfil = async () => {
      const { profil: profil_slug } = router.query;
      console.log('Router:', router);
      console.log('PREEEEEEE Profil:', profil_slug);

      if (!profil_slug) {
        console.error('Profil slug is undefined');
        return;
      }

      console.log('Fetching Profil:', profil_slug);
      setLoading(true);

      try {
        const response = await fetch(`/api/render?profil=${profil_slug}`);
        const data = await response.json();

        if (response.ok) {
          console.log('Fetched Profil Data:', data);
          setProfil(data);
        } else {
          console.error('Error fetching profil:', data.error);
        }
      } catch (error) {
        console.error('Error fetching profil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [router.isReady, router.query]);
    
  return (
    <div>
      <Head>
        <title>{profil?.profil_meta_title}</title>
        <meta name="description" content={profil?.profil_meta_desc} />
      </Head>
      <Header setResult={(query) => handleSearch(query, router)} searchInputRef={searchInputRef} />
      <main className="container profil">
        {loading || !profil ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>On the way</p>
          </div>
        ) : (
          <>
            <h1>{profil?.profil_meta_title}</h1>
            <h3>{profil?.profil_meta_desc}</h3>
            <section>
              <form>
                <span className='sub-title'>Live AI Quote Simulator</span>
                <div className='form-row'>
                  <label>
                    <span>Expert title</span>
                    <input type="text" placeholder="Expert title" />
                  </label>
                  <label>
                    <span>Location</span>
                    <input type="text" placeholder="Location" />
                  </label>
                </div>
                <label>
                  <textarea placeholder="Describe your project in few words"></textarea>
                </label>
                <button type="submit">Generate Quote Now</button>
              </form>
              <div className='result-container'>
                <article>
                  <p className='result-cache'>Generation result will appear here</p>
                </article>
              </div>
            </section>
            <div className='blocks-container'>
              <article>
                <img src='/trustpilot.svg' alt="Trustpilot logo"/>
                <h4>4.8/5 Generator Scores</h4>
                <p>Based on 674 legit reviews on trustpilot.com</p>
              </article>
              <article>
                <i className="fas fa-robot"></i>
                <h4>Instant Free Quotes</h4>
                <p>Get quotes instantly using our AI-powered tool</p>
              </article>
              <article>
                <i className="fas fa-chart-bar"></i>
                <h4>1 857 Utilisations</h4>
                <p>Track the usage and performance of your quotes</p>
              </article>
            </div>
            <div className='guide-container'>
              <h2 className='guide-title'>How to Hire The Right {profil?.profil_title} in {profil?.profil_location} ?</h2>
              <div className='content' dangerouslySetInnerHTML={{ __html: profil?.profil_guide }} />
            </div>
            <LocalSlider profil={profil?.profil_slug} />

            <p>{profil?.profil_location}</p>
            <p>{profil?.profil_tjm}</p>
          </>
        )}
      </main>
    </div>
  );
}