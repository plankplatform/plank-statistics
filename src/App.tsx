import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StatPage from './pages/StatPage';
import ScrollToTop from './components/ScrollToTop';
import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  useEffect(() => {
    const handleClick = () => {
      window.parent.postMessage({ type: 'externalClick' }, '*');
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div>
      <TooltipProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stat/:statId" element={<StatPage />} />
        </Routes>
      </TooltipProvider>
    </div>
  );
}

export default App;
