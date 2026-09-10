import React, { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import logoImage from "@/presentation/assets/logo.svg";
import Footer from "@/presentation/components/Footer";

import { Header, Issues, RespositoryInfo, LoadMoreButton } from "./styles";
import { GetRepositoryDetails } from "@/domain/use-cases/GetRepositoryDetails";
import { RepositoryDetails } from "@/domain/models/RepositoryDetails";
import { GetRepositoryIssues } from "@/domain/use-cases/GetRepositoryIssues";
import { RepositoryIssue } from "@/domain/models/RepositoryIssue";

/**
 *  👋👨‍💻 Hey there! It's time to make some changes. 🚀
 *  Here are some Next Steps for you:
 *  ✨ Add/Create smaller components when possible.
 *  🧪 Add unit tests.
 *  🧹 Apply Clean Code to this project.
 *  If you have any Further Questions,
 *  feel free to contact me: # 📩
 */

interface Props {
  getRepositoryDetails: GetRepositoryDetails;
  getRepositoryIssues: GetRepositoryIssues;
}

const RepositoryDetailsPage: React.FC<Props> = ({
  getRepositoryDetails,
  getRepositoryIssues,
}: Props) => {
  const { owner = "", repositoryName = "" } = useParams<{
    owner: string;
    repositoryName: string;
  }>();
  const [repository, setRepository] = useState<RepositoryDetails | null>(null);
  const [issues, setIssues] = useState<RepositoryIssue[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getRepositoryDetails
      .get(owner, repositoryName)
      .then((repository) => {
        setRepository(repository);
      })
      .catch(() => {
        setRepository(null);
      });

    loadIssues(1);
  }, [getRepositoryDetails, getRepositoryIssues, owner, repositoryName]);

  const loadIssues = (page: number) => {
    setIsLoading(true);
    getRepositoryIssues
      .get(owner, repositoryName, page)
      .then((result) => {
        if (page === 1) {
          setIssues(result.issues);
        } else {
          setIssues((prevIssues) => [...prevIssues, ...result.issues]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
      })
      .catch(() => {
        if (page === 1) {
          setIssues([]);
        }
        setHasMore(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleLoadMore = () => {
    loadIssues(currentPage + 1);
  };

  return (
    <>
      <Header>
        <img src={logoImage} alt="Github Explorer" />
        <Link to="/">
          <FiChevronLeft size={16} color="#3D3D4D" />
          <strong>Go back</strong>
        </Link>
      </Header>
      {repository ? (
        <RespositoryInfo>
          <header>
            <img src={repository.owner.avatar} alt="Owner profile avatar" />
            <div>
              <strong>{repository.name}</strong>
              <p>{repository.description}</p>
            </div>
          </header>
          <ul>
            <li>
              <strong>{repository.stars}</strong>
              <span>Stars</span>
            </li>
            <li>
              <strong>{repository.forks}</strong>
              <span>Forks</span>
            </li>
            <li>
              <strong>{repository.issues}</strong>
              <span>Open issues</span>
            </li>
          </ul>
        </RespositoryInfo>
      ) : (
        <p>Loading information.</p>
      )}

      <Issues>
        {issues.map((issue) => (
          <a key={issue.id} href={issue.linkTo}>
            <div>
              <strong>{issue.title}</strong>
              <p>{issue.createdBy}</p>
            </div>
            <FiChevronRight size={20} />
          </a>
        ))}
        {hasMore && (
          <LoadMoreButton
            onClick={handleLoadMore}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Carregando..." : "Carregar mais"}
          </LoadMoreButton>
        )}
      </Issues>

      <Footer />
    </>
  );
};

export default RepositoryDetailsPage;
