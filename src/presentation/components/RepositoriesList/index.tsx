import React, { MouseEvent } from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container, RemoveButton } from "./styles";

interface Props {
  repositories: Repository[];
  onRemoveRepository: (repository: Repository) => void;
}
const RepositoriesList: React.FC<Props> = ({
  repositories,
  onRemoveRepository,
}: Props) => {
  const handleRemove = (
    event: MouseEvent<HTMLButtonElement>,
    repository: Repository
  ): void => {
    event.preventDefault();
    onRemoveRepository(repository);
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
            <RemoveButton
              type="button"
              aria-label={`Remove ${name}`}
              onClick={(event) => handleRemove(event, repository)}
            >
              <FiTrash2 size={20} />
            </RemoveButton>
            <FiChevronRight size={20} />
          </Link>
        );
      })}
    </Container>
  );
};

export default RepositoriesList;
