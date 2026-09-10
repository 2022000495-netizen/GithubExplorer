import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import api from '../../services/api';

import logoImage from '../../assets/logo.svg';
import Footer from '../../components/Footer';

import { Header, RespositoryInfo, Issues, LoadMoreButton } from './styles';

const ISSUES_PER_PAGE = 5;

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

const Repository: React.FC = () => {
  const { '*': repositoryName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesPage, setIssuesPage] = useState(1);
  const [hasMoreIssues, setHasMoreIssues] = useState(true);
  const [loadingMoreIssues, setLoadingMoreIssues] = useState(false);

  useEffect(() => {
    setIssues([]);
    setIssuesPage(1);
    setHasMoreIssues(true);

    api.get(`/repos/${repositoryName}`).then((response) => {
      setRepository(response.data);
    });
    api
      .get(`/repos/${repositoryName}/issues`, {
        params: {
          page: 1,
          per_page: ISSUES_PER_PAGE,
        },
      })
      .then((response) => {
        setIssues(response.data);
        setHasMoreIssues(response.data.length === ISSUES_PER_PAGE);
      });
  }, [repositoryName]);

  async function handleLoadMoreIssues(): Promise<void> {
    const nextPage = issuesPage + 1;

    setLoadingMoreIssues(true);

    try {
      const response = await api.get(`/repos/${repositoryName}/issues`, {
        params: {
          page: nextPage,
          per_page: ISSUES_PER_PAGE,
        },
      });

      setIssues([...issues, ...response.data]);
      setIssuesPage(nextPage);
      setHasMoreIssues(response.data.length === ISSUES_PER_PAGE);
    } finally {
      setLoadingMoreIssues(false);
    }
  }

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

      {hasMoreIssues && (
        <LoadMoreButton
          type="button"
          onClick={handleLoadMoreIssues}
          disabled={loadingMoreIssues}
        >
          {loadingMoreIssues ? 'Carregando...' : 'Carregar mais'}
        </LoadMoreButton>
      )}

      <Footer />
    </>
  );
};

export default Repository;
