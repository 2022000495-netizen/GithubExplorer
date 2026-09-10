import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import api from '../../services/api';

import logoImage from '../../assets/logo.svg';
import Footer from '../../components/Footer';

import { Header, RespositoryInfo, Issues, TabsContainer, TabsButtons } from './styles';

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
  created_at: string;
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
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'issues' | 'pulls'>('issues');

  useEffect(() => {
    api.get(`/repos/${repositoryName}`).then((response) => {
      setRepository(response.data);
    });
    api.get(`/repos/${repositoryName}/issues`).then((response) => {
      setIssues(response.data);
    });
    api.get(`/repos/${repositoryName}/pulls`).then((response) => {
      setPullRequests(response.data);
    });
  }, [repositoryName]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

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

      <TabsContainer>
        <TabsButtons>
          <button
            className={activeTab === 'issues' ? 'active' : ''}
            onClick={() => setActiveTab('issues')}
          >
            Issues ({issues.length})
          </button>
          <button
            className={activeTab === 'pulls' ? 'active' : ''}
            onClick={() => setActiveTab('pulls')}
          >
            Pull Requests ({pullRequests.length})
          </button>
        </TabsButtons>

        <Issues>
          {activeTab === 'issues' && issues.map((issue) => (
            <a key={issue.id} href={issue.html_url}>
              <div>
                <strong>{issue.title}</strong>
                <p>{issue.user.login} em {formatDate(issue.created_at)}</p>
              </div>
              <FiChevronRight size={20} />
            </a>
          ))}

          {activeTab === 'pulls' && pullRequests.map((pr) => (
            <a key={pr.id} href={pr.html_url}>
              <div>
                <strong>{pr.title}</strong>
                <p>{pr.user.login} em {formatDate(pr.created_at)}</p>
              </div>
              <FiChevronRight size={20} />
            </a>
          ))}
        </Issues>
      </TabsContainer>

      <Footer />
    </>
  );
};

export default Repository;
