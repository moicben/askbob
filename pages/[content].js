import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import RelatedQuestions from '../components/RelatedQuestions';
import LocalSlider from '../components/LocalSlider';
import SimilarQueries from '../components/SimilarQueries';

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

const handleSearch = (query, router) => {
  const slug = generateSlug(query);
  router.push(`/${slug}`);
};

export default function ContentPage() {
  const router = useRouter();
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null); // Add this line

  useEffect(() => {
    setLoading(true);
    const fetchContent = async () => {
      const { content } = router.query;

      if (!content) {
        console.error('Content parameter is undefined');
        return;
      }

      try {
        const contentResponse = await fetch(`/api/render?content=${content}`);
        const contentData = await contentResponse.json();

        console.log('contentData', contentData.locals);
        if (contentResponse.ok && contentData.locals) {
          setLoading(false);
          setCurrentContent(contentData);
        } else {
          console.error('Error fetching content queries');
        }
      } catch (error) {
        console.error('Error fetching content queries:', error);
      }
    };

    fetchContent();
  }, [router.query]);

  return (
    <div>
      <Head>
        {currentContent && <title>{currentContent.content_title}</title>}
        {currentContent && <meta name="description" content={currentContent.content_desc} />}
        <meta name="keywords" content="content, online services, expertise, support" />
        <meta name="author" content="My Expert" />
        <link rel="icon" href="/bob-favicon.png" />
      </Head>
      <Header setResult={(query) => handleSearch(query, router)} searchInputRef={searchInputRef} /> {/* Pass searchInputRef */}
      <main className="container">
        <p className="response">Bob's result:</p>
        <section>

          {loading || !currentContent ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>On the way</p>
            </div>
          ) : (
            <>
              {currentContent && currentContent.locals.length > 2 ? (
                <LocalSlider currentContent={currentContent.locals} />
              ) : (
                <p>No locals companies</p>
              )}
              <hr />
              {currentContent && currentContent.content_body ? (
                <div className="content" dangerouslySetInnerHTML={{ __html: currentContent.content_body }} />
              ) : (
                <p>No content available</p>
              )}
              <hr />
              {currentContent && currentContent.faqs ? (
                <RelatedQuestions setResult={(query) => handleSearch(query, router)} currentContent={currentContent} />
              ) : (
                <p>No FAQs available</p>
              )}
            </>
          )}
        </section>
        <p className="response similars">Similar queries:</p>
        {currentContent && currentContent.similars && (
          <SimilarQueries currentContent={currentContent.similars} searchInputRef={searchInputRef} /> 
        )}
      </main>
    </div>
  );
}