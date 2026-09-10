import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import api from '../../services/api';

import logoImage from '../../assets/logo.svg';
import Footer from '../../components/Footer';

import { Header, RespositoryInfo, Issues, LoadMoreButton } from './styles';

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

const ISSUES_PER_PAGE = 10;

const Repository: React.FC = () => {
  const { '*': repositoryName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreIssues, setHasMoreIssues] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIssues = useCallback((page: number) => {
    setIsLoading(true);
    api
      .get(`/repos/${repositoryName}/issues`, {
        params: {
          page,
          per_page: ISSUES_PER_PAGE,
          state: 'open',
          sort: 'created',
          direction: 'desc',
        },
      })
      .then((response) => {
        const newIssues = response.data as Issue[];
        if (page === 1) {
          setIssues(newIssues);
        } else {
          setIssues((prevIssues) => [...prevIssues, ...newIssues]);
        }
        setHasMoreIssues(newIssues.length === ISSUES_PER_PAGE);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [repositoryName]);

  useEffect(() => {
    api.get(`/repos/${repositoryName}`).then((response) => {
      setRepository(response.data);
    });
    fetchIssues(1);
  }, [repositoryName, fetchIssues]);

  const handleLoadMore = () => {
    fetchIssues(currentPage + 1);
    setCurrentPage(currentPage + 1);
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
        <LoadMoreButton onClick={handleLoadMore} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Carregar mais'}
        </LoadMoreButton>
      )}

      <Footer />
    </>
  );
};

export default Repository;
