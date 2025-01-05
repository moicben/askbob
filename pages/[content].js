import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import Header from '../components/Header';
import RelatedQuestions from '../components/RelatedQuestions';
import LocalSlider from '../components/LocalSlider'; // Import the new LocalSlider component
import SimilarQueries from '../components/SimilarQueries'; // Import the new SimilarQueries component


const CustomNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      →
    </div>
  );
};

const CustomPrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      ←
    </div>
  );
};

export default function ContentPage() {
  const router = useRouter();
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locals, setLocals] = useState([]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  };

  const handleSearch = (query) => {
    const slug = generateSlug(query);
    router.push(`/${slug}`);
  };

    // ...existing code...
  
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const { content } = router.query;
  
      if (!content) {
        console.error('Content parameter is undefined');
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`/api/render?content=${content}`);
        const data = await response.json();
  
        if (response.ok) {
          setCurrentContent(data);
        } else {
          console.error('Error fetching content:', data.error);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchContent();
  }, [router.query]);
  
  useEffect(() => {
    const fetchLocals = async () => {
      const { content } = router.query;
  
      if (!content) {
        console.error('Content parameter is undefined');
        return;
      }
  
      try {
        const response = await fetch(`/api/render?locals=${content}`);
        const data = await response.json();
  
        console.log("locals dataaaaa", data);
  
        if (response.ok) {
          setLocals(data);
        } else {
          console.error('Error fetching locals:', data.error);
        }
      } catch (error) {
        console.error('Error fetching locals:', error);
      }
    };
  
    fetchLocals();
  }, [router.query]);
  
  // ...existing code...
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Display 3 results at a time
    slidesToScroll: 1, // Scroll one by one
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
  };
  // ...existing code...

  if (loading || !currentContent) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        {currentContent && <title>{currentContent.content_title}</title>}
        {currentContent && <meta name="description" content={currentContent.content_desc} />}
        <meta name="keywords" content="content, online services, expertise, support" />
        <meta name="author" content="My Expert" />
        <link rel="icon" href="/bob-favicon.png" />
      </Head>
      <Header setResult={handleSearch} />
      <main className='container'>
        <p className='response'>Bob's answer:</p>
        <section>
          {loading || !currentContent ? (
            <div className='spinner-container'>
              <div className="spinner"></div>
              <p>On the way</p>
            </div>
          ) : (
            <>
              <LocalSlider locals={locals} />
              <hr />
              <div className='content' dangerouslySetInnerHTML={{ __html: currentContent.content_body }} />
              <hr />
              <RelatedQuestions setResult={handleSearch} currentContent={currentContent} />
            </>
          )}
        </section>
        <p className='response similars'>Similar queries:</p>
        <SimilarQueries content={currentContent.content_request} /> {/* Add SimilarQueries component */}
      </main>
    </div>
  );
}