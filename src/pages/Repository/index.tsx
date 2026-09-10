import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import api from '../../services/api';

import logoImage from '../../assets/logo.svg';
import Footer from '../../components/Footer';

import { Header, RespositoryInfo, Issues, Tabs, Tab } from './styles';

interface Repository {
  full_name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}
interface Issue {
  id: number;
  title: string;
  html_url: string;
  user: {
    login: string;
  };
}

interface PullRequest {
  id: number;
  title: string;
  html_url: string;
  user: {
    login: string;
  };
  created_at: string;
}

const Repository: React.FC = () => {
  const { '*': repositoryName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'issues' | 'pulls'>('issues');

  useEffect(() => {
    api.get(`/repos/${repositoryName}`).then((response) => {
      setRepository(response.data);
    });
    api.get(`/repos/${repositoryName}/issues`).then((response) => {
      setIssues(response.data);
    });
    api.get(`/repos/${repositoryName}/pulls?state=open`).then((response) => {
      setPulls(response.data);
    });
  }, [repositoryName]);

  return (
    <>
      <Header>
        <img src={logoImage} alt="Github Explorer" />
        <Link to="/">
          <FiChevronLeft size={16} color="#3D3D4D" />
          <strong>Voltar</strong>
        </Link>
      </Header>
      {repository ? (
        <RespositoryInfo>
          <header>
            <img src={repository.owner.avatar_url} alt="Owner profile avatar" />
            <div>
              <strong>{repository.full_name}</strong>
              <p>{repository.description}</p>
            </div>
          </header>
          <ul>
            <li>
              <strong>{repository.stargazers_count}</strong>
              <span>Stars</span>
            </li>
            <li>
              <strong>{repository.forks_count}</strong>
              <span>Forks</span>
            </li>
            <li>
              <strong>{repository.open_issues_count}</strong>
              <span>Issues abertos</span>
            </li>
          </ul>
        </RespositoryInfo>
      ) : (
        <p>Carregando informações.</p>
      )}

      <Tabs>
        <Tab isActive={activeTab === 'issues'} onClick={() => setActiveTab('issues')}>
          Issues ({issues.length})
        </Tab>
        <Tab isActive={activeTab === 'pulls'} onClick={() => setActiveTab('pulls')}>
          Pull Requests ({pulls.length})
        </Tab>
      </Tabs>

      <Issues>
        {activeTab === 'issues' &&
          issues.map((issue) => (
            <a key={issue.id} href={issue.html_url}>
              <div>
                <strong>{issue.title}</strong>
                <p>{issue.user.login}</p>
              </div>
              <FiChevronRight size={20} />
            </a>
          ))}
        {activeTab === 'pulls' &&
          pulls.map((pull) => (
            <a key={pull.id} href={pull.html_url}>
              <div>
                <strong>{pull.title}</strong>
                <p>{pull.user.login}</p>
              </div>
              <FiChevronRight size={20} />
            </a>
          ))}
      </Issues>

      <Footer />
    </>
  );
};

export default Repository;
