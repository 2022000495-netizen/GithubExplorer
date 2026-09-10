import React, { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import logoImage from "@/presentation/assets/logo.svg";
import Footer from "@/presentation/components/Footer";

import { Header, Issues, PullRequests, RespositoryInfo, SectionTitle } from "./styles";
import { GetRepositoryDetails } from "@/domain/use-cases/GetRepositoryDetails";
import { RepositoryDetails } from "@/domain/models/RepositoryDetails";
import { GetRepositoryIssues } from "@/domain/use-cases/GetRepositoryIssues";
import { RepositoryIssue } from "@/domain/models/RepositoryIssue";
import { GetRepositoryPullRequests } from "@/domain/use-cases/GetRepositoryPullRequests";
import { RepositoryPullRequest } from "@/domain/models/RepositoryPullRequest";

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
  getRepositoryPullRequests: GetRepositoryPullRequests;
}

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString();

const RepositoryDetailsPage: React.FC<Props> = ({
  getRepositoryDetails,
  getRepositoryIssues,
  getRepositoryPullRequests,
}: Props) => {
  const { owner = "", repositoryName = "" } = useParams<{
    owner: string;
    repositoryName: string;
  }>();
  const [repository, setRepository] = useState<RepositoryDetails | null>(null);
  const [issues, setIssues] = useState<RepositoryIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<RepositoryPullRequest[]>(
    []
  );

  useEffect(() => {
    getRepositoryDetails
      .get(owner, repositoryName)
      .then((repository) => {
        setRepository(repository);
      })
      .catch(() => {
        setRepository(null);
      });

    getRepositoryIssues
      .get(owner, repositoryName)
      .then((issues) => {
        setIssues(issues);
      })
      .catch(() => {
        setIssues([]);
      });

    getRepositoryPullRequests
      .get(owner, repositoryName)
      .then((pullRequests) => {
        setPullRequests(pullRequests);
      })
      .catch(() => {
        setPullRequests([]);
      });
  }, [
    getRepositoryDetails,
    getRepositoryIssues,
    getRepositoryPullRequests,
    owner,
    repositoryName,
  ]);

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
      </Issues>

      {pullRequests.length > 0 && (
        <>
          <SectionTitle>Open pull requests</SectionTitle>
          <PullRequests>
            {pullRequests.map((pullRequest) => (
              <a key={pullRequest.id} href={pullRequest.linkTo}>
                <div>
                  <strong>{pullRequest.title}</strong>
                  <p>
                    {pullRequest.createdBy} · opened on{" "}
                    {formatDate(pullRequest.createdAt)}
                  </p>
                </div>
                <FiChevronRight size={20} />
              </a>
            ))}
          </PullRequests>
        </>
      )}

      <Footer />
    </>
  );
};

export default RepositoryDetailsPage;
