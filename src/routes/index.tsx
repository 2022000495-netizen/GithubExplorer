import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import Repository from '../pages/Repository';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/repositories/*" element={<Repository />} />
  </Routes>
);

export default AppRoutes;
