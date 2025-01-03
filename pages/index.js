import { useState } from 'react';
import Header from '../components/Header';
import DisplayResult from '../components/DisplayResult';
import Head from 'next/head';

import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const Index = () => {
  const [result, setResult] = useState('');

  return (
    <div>
        <Head>
        <title>Ask Bob! Search Engine + (very) Friendly AI</title>
        <meta name="description" content='Meet Bob: the ultimate search engine powered by a (very) friendly AI. Get quick and enjoy a smarter way to search: Ask Bob Now!' />
        <meta name="keywords" content="content, online services, expertise, support" />
        <meta name="author" content="My Expert" />
        <link rel="icon" href="/bob-favicon.png" />
      </Head>
      <Header setResult={setResult} />
      <DisplayResult result={result} />
        <main className='hero'>
          <h1>Welcome to Bob..</h1>
          <p className='teaser'>I'm Bob, your friendly AI and search engine all rolled into one. Need quick answers? Looking for detailed info? Or maybe you just want help tackling a tricky question? I’ve got you covered. Think of me as your super handy assistant—always ready to lend a hand, whether it’s finding the perfect info or giving you practical advice. Got something on your mind? Reach out anytime at hello@askbob.online. Let’s chat soon!</p> 
        </main>
      </div>
  );
};

export default Index;