import React, { useState, FormEvent, useEffect } from 'react';
import { FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import logoImage from '../../assets/logo.svg';
import Footer from '../../components/Footer';

import { Title, Form, Repositories, Error } from './styles';

interface Repository {
  full_name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

const Home: React.FC = () => {
  const [newRepo, setNewRepo] = useState('');
  const [inputError, setInputError] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>(() => {
    const storagedRepositories = localStorage.getItem(
      '@GihubExplorer:repositories',
    );

    if (storagedRepositories) {
      return JSON.parse(storagedRepositories);
    }
    return [];
  });

  async function handleAddRepository(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!newRepo) {
      setInputError('Digite o autor/nome do repositório ');
      return;
    }
    try {
      const response = await api.get<Repository>(`repos/${newRepo}`);

      const repository = response.data;

      setRepositories([...repositories, repository]);

      setNewRepo('');

      setInputError('');
    } catch (error) {
      setInputError(
        'Erro na busca por esse repositório. Verifique o nome/repositório usados.',
      );
    }
  }

  function handleRemoveRepository(fullName: string): void {
    setRepositories(
      repositories.filter((repository) => repository.full_name !== fullName),
    );
  }

  useEffect(() => {
    localStorage.setItem(
      '@GihubExplorer:repositories',
      JSON.stringify(repositories),
    );
  }, [repositories]);

  return (
    <>
      <img src={logoImage} alt="Github Explorer" />
      <Title>Explore repositórios no github.</Title>

      <Form hasError={!!inputError} onSubmit={handleAddRepository}>
        <input
          value={newRepo}
          onChange={(e) => setNewRepo(e.target.value)}
          placeholder="Digite o nome do repositório"
        />
        <button type="submit">Pesquisar</button>
      </Form>
      {inputError && <Error>{inputError}</Error>}

      <Repositories>
        {repositories.map((repository) => (
          <Link key={crypto.randomUUID()} to={`/repositories/${repository.full_name}`}>
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
            />
            <div>
              <strong>{repository.full_name}</strong>
              <p>{repository.description}</p>
            </div>
            <button
              type="button"
              aria-label={`Remover repositório ${repository.full_name}`}
              onClick={(e) => {
                e.preventDefault();
                handleRemoveRepository(repository.full_name);
              }}
            >
              <FiTrash2 size={20} />
            </button>
            <FiChevronRight size={20} />
          </Link>
        ))}
      </Repositories>

      <Footer />
    </>
  );
};

export default Home;
