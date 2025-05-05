import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GroupStats from './pages/GroupStats';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/group/:groupName" element={<GroupStats />} />
      <Route path="/group/:groupName/stat/:statName" element={<GroupStats />} />
    </Routes>
  );
}

export default App;
