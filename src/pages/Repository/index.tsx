import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import api from '../../services/api';

import logoImage from '../../assets/logo.svg';
import Footer from '../../components/Footer';

import {
  Header,
  RespositoryInfo,
  Issues,
  PullRequests,
  SectionTitle,
} from './styles';

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
  created_at: string;
  user: {
    login: string;
  };
}

const Repository: React.FC = () => {
  const { '*': repositoryName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);

  useEffect(() => {
    api.get(`/repos/${repositoryName}`).then((response) => {
      setRepository(response.data);
    });
    api.get(`/repos/${repositoryName}/issues`).then((response) => {
      setIssues(response.data);
    });
    api
      .get(`/repos/${repositoryName}/pulls`, { params: { state: 'open' } })
      .then((response) => {
        setPullRequests(response.data);
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

      <Issues>
        <SectionTitle>Issues</SectionTitle>
        {issues.map((issue) => (
          <a key={issue.id} href={issue.html_url}>
            <div>
              <strong>{issue.title}</strong>
              <p>{issue.user.login}</p>
            </div>
            <FiChevronRight size={20} />
          </a>
        ))}
      </Issues>

      <PullRequests>
        <SectionTitle>Pull Requests abertos</SectionTitle>
        {pullRequests.map((pullRequest) => (
          <a key={pullRequest.id} href={pullRequest.html_url}>
            <div>
              <strong>{pullRequest.title}</strong>
              <p>
                {pullRequest.user.login} · criado em{' '}
                {new Date(pullRequest.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <FiChevronRight size={20} />
          </a>
        ))}
      </PullRequests>

      <Footer />
    </>
  );
};

export default Repository;
