import React from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container, RemoveButton } from "./styles";

interface Props {
  repositories: Repository[];
  onRemove?: (owner: string, name: string) => void;
}
const RepositoriesList: React.FC<Props> = ({ repositories, onRemove }: Props) => {
  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    owner: string,
    name: string
  ) => {
    e.preventDefault();
    onRemove?.(owner, name);
  };

  return (
    <Container>
      {repositories.map(({ name, description, owner }) => (
        <div key={`${owner.login}/${name}`} className="repository-item">
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
              onClick={(e) => handleRemoveClick(e, owner.login, name)}
              title="Remove repository"
            >
              <FiTrash2 size={20} />
            </RemoveButton>
          )}
        </div>
      ))}
    </Container>
  );
};

export default RepositoriesList;
