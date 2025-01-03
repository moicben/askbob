import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import Header from '../components/Header';
import DisplayResult from '../components/DisplayResult';
import RelatedQuestions from '../components/RelatedQuestions';

export default function ContentPage() {
  const router = useRouter();
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const { content } = router.query;

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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!currentContent) {
    return <p>No content found</p>;
  }

  return (
    <div >
      <Head>
        <title>{currentContent.content_title}</title>
        <meta name="description" content={currentContent.content_desc} />
        <meta name="keywords" content="content, online services, expertise, support" />
        <meta name="author" content="My Expert" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header setResult={handleSearch} />
      <main className='container'>
        <p className='response'>Bob's answer:</p>
        <section>
          <DisplayResult body={currentContent.content_body} />
          <hr/>
          <RelatedQuestions setResult={handleSearch} currentContent={currentContent} />
        </section>
      </main>
    </div>
  );
}