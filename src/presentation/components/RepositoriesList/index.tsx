import React from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container, RemoveButton } from "./styles";

interface Props {
  repositories: Repository[];
  onRemove?: (repository: Repository) => void;
}
const RepositoriesList: React.FC<Props> = ({ repositories, onRemove }: Props) => {
  const handleRemove = (
    event: React.MouseEvent<HTMLButtonElement>,
    repository: Repository
  ) => {
    event.preventDefault();
    onRemove?.(repository);
  };

  return (
    <Container>
      {repositories.map(({ name, description, owner }) => (
        <Link key={`${name}`} to={`/repositories/${owner.login}/${name}`}>
          <img src={owner.avatar} alt={owner.login} />
          <div>
            <strong>{name}</strong>
            <p>{description}</p>
          </div>
          <FiChevronRight size={20} />
          {onRemove && (
            <RemoveButton
              type="button"
              onClick={(event) =>
                handleRemove(event, { name, description, owner })
              }
              title="Remove repository"
              aria-label={`Remove ${name} repository`}
            >
              <FiTrash2 size={18} />
            </RemoveButton>
          )}
        </Link>
      ))}
    </Container>
  );
};

export default RepositoriesList;
