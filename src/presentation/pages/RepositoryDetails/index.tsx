import React, { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import logoImage from "@/presentation/assets/logo.svg";
import Footer from "@/presentation/components/Footer";

import { Header, Issues, LoadMoreButton, RespositoryInfo } from "./styles";
import { GetRepositoryDetails } from "@/domain/use-cases/GetRepositoryDetails";
import { RepositoryDetails } from "@/domain/models/RepositoryDetails";
import {
  GetRepositoryIssues,
  ISSUES_PER_PAGE,
} from "@/domain/use-cases/GetRepositoryIssues";
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
  const [issuesPage, setIssuesPage] = useState(1);
  const [hasMoreIssues, setHasMoreIssues] = useState(false);
  const [loadingMoreIssues, setLoadingMoreIssues] = useState(false);

  useEffect(() => {
    getRepositoryDetails
      .get(owner, repositoryName)
      .then((repository) => {
        setRepository(repository);
      })
      .catch(() => {
        setRepository(null);
      });

    setIssuesPage(1);
    getRepositoryIssues
      .get(owner, repositoryName, 1)
      .then((issues) => {
        setIssues(issues);
        setHasMoreIssues(issues.length === ISSUES_PER_PAGE);
      })
      .catch(() => {
        setIssues([]);
        setHasMoreIssues(false);
      });
  }, [getRepositoryDetails, getRepositoryIssues, owner, repositoryName]);

  async function handleLoadMoreIssues(): Promise<void> {
    const nextPage = issuesPage + 1;
    setLoadingMoreIssues(true);

    try {
      const nextIssues = await getRepositoryIssues.get(
        owner,
        repositoryName,
        nextPage
      );

      setIssues((currentIssues) => [...currentIssues, ...nextIssues]);
      setIssuesPage(nextPage);
      setHasMoreIssues(nextIssues.length === ISSUES_PER_PAGE);
    } catch {
      setHasMoreIssues(false);
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

        {hasMoreIssues && (
          <LoadMoreButton
            type="button"
            onClick={() => handleLoadMoreIssues()}
            disabled={loadingMoreIssues}
          >
            {loadingMoreIssues ? "Loading..." : "Load more"}
          </LoadMoreButton>
        )}
      </Issues>

      <Footer />
    </>
  );
};

export default RepositoryDetailsPage;
