import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StatPage from './pages/StatPage';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <div>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/group/:groupName/stat/:statId" element={<StatPage />} />
      </Routes>
    </div>
  );
}

export default App;
