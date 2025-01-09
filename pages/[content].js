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

        //console.log('contentData', contentData.locals);
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

    //console.log('router.query', router.query.content);

    fetchContent();
  }, [router.query]);

  return (
    <div>
      <Head>
        {currentContent && <title>{currentContent.content_title}</title>}
        {currentContent && <meta name="description" content={currentContent.content_desc} />}
        <meta name="keywords" content={`${currentContent?.content_request}, best results, full guide`} />
        <meta name="author" content="My Expert" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content={router.query.content && router.query.content.length < 10 ? "noindex, nofollow" : "index, follow"} />
        <link rel="icon" href="/bob-favicon.png" />
        <link rel="canonical" href={`https://askbob.online/${router.query.content}`} />
        
        {/* Open Graph tags */}
        {currentContent && (
          <>
            <meta property="og:title" content={currentContent.content_title} />
            <meta property="og:description" content={currentContent.content_desc} />
            <meta property="og:type" content="article" />
            <meta property="og:url" content={`https://askbob.online/${router.query.content}`} />
            <meta property="og:image" content={currentContent.content_image} />
          </>
        )}

        {/* Twitter Card tags */}
        {currentContent && (
          <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={currentContent.content_title} />
            <meta name="twitter:description" content={currentContent.content_desc} />
            <meta name="twitter:image" content={currentContent.content_image} />
          </>
        )}

        {/* Structured Data */}
        {currentContent && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": currentContent.content_title,
              "description": currentContent.content_desc,
              "image": currentContent.content_image,
              "author": {
                "@type": "Person",
                "name": "Bob"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Askbob.online",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://askbob.online/bob-favicon.png"
                }
              },
              "datePublished": currentContent.content_created_at,
              "dateModified": currentContent.content_created_at
            })}
          </script>
        )}
      </Head>
      <Header setResult={(query) => handleSearch(query, router)} searchInputRef={searchInputRef} /> {/* Pass searchInputRef */}
      <main className="container">
        <p className="response">Bob's result:</p>
        <section>

          {loading || !currentContent ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Loading the content</p>
            </div>
          ) : (
            <>
              <LocalSlider currentContent={currentContent.locals} />


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