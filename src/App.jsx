import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GroupStats from './pages/GroupStats';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <div className="w-full">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/group/:groupName" element={<GroupStats />} />
        <Route path="/group/:groupName/stat/:statName" element={<GroupStats />} />
      </Routes>
    </div>
  );
}

export default App;
