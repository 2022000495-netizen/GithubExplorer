import React, { MouseEvent } from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container } from "./styles";

interface Props {
  repositories: Repository[];
  onRemove: (repository: Repository) => void;
}
const RepositoriesList: React.FC<Props> = ({
  repositories,
  onRemove,
}: Props) => {
  const handleRemove = (
    event: MouseEvent<HTMLButtonElement>,
    repository: Repository
  ): void => {
    event.preventDefault();
    onRemove(repository);
  };

  return (
    <Container>
      {repositories.map((repository) => {
        const { name, description, owner } = repository;

        return (
          <Link key={`${name}`} to={`/repositories/${owner.login}/${name}`}>
            <img src={owner.avatar} alt={owner.login} />
            <div>
              <strong>{name}</strong>
              <p>{description}</p>
            </div>
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={(event) => handleRemove(event, repository)}
            >
              <FiTrash2 size={20} />
            </button>
            <FiChevronRight size={20} />
          </Link>
        );
      })}
    </Container>
  );
};

export default RepositoriesList;
