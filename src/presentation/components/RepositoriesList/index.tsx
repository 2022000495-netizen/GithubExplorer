import React from "react";
import { FiChevronRight, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container, RemoveButton } from "./styles";

interface Props {
  repositories: Repository[];
  onRemove?: (repositoryName: string) => void;
}
const RepositoriesList: React.FC<Props> = ({ repositories, onRemove }: Props) => {
  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    repositoryName: string
  ) => {
    e.preventDefault();
    onRemove?.(repositoryName);
  };

  return (
    <Container>
      {repositories.map(({ name, description, owner }) => (
        <div key={`${name}`} className="repository-item">
          <Link to={`/repositories/${owner.login}/${name}`}>
            <img src={owner.avatar} alt={owner.login} />
            <div>
              <strong>{name}</strong>
              <p>{description}</p>
            </div>
            <FiChevronRight size={20} />
          </Link>
          {onRemove && (
            <RemoveButton
              onClick={(e) => handleRemoveClick(e, name)}
              title="Remove repository"
              aria-label={`Remove ${name}`}
            >
              <FiX size={20} />
            </RemoveButton>
          )}
        </div>
      ))}
    </Container>
  );
};

export default RepositoriesList;
