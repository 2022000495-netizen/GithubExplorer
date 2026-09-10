import React, { MouseEvent, useCallback } from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container, RemoveButton } from "./styles";

interface Props {
  repositories: Repository[];
  onRemove: (repository: Repository) => void;
}
const RepositoriesList: React.FC<Props> = ({
  repositories,
  onRemove,
}: Props) => {
  const handleRemove = useCallback(
    (event: MouseEvent<HTMLButtonElement>, repository: Repository) => {
      event.preventDefault();
      onRemove(repository);
    },
    [onRemove]
  );

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
