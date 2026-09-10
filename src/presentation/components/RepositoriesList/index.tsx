import React, { useCallback } from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container, DeleteButton } from "./styles";

interface Props {
  repositories: Repository[];
  onDelete?: (owner: string, name: string) => void;
}
const RepositoriesList: React.FC<Props> = ({
  repositories,
  onDelete,
}: Props) => {
  const handleDelete = useCallback(
    (e: React.MouseEvent, owner: string, name: string) => {
      e.preventDefault();
      onDelete?.(owner, name);
    },
    [onDelete]
  );

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
          {onDelete && (
            <DeleteButton
              onClick={(e) => handleDelete(e, owner.login, name)}
              title="Remove repository"
            >
              <FiTrash2 size={18} />
            </DeleteButton>
          )}
        </Link>
      ))}
    </Container>
  );
};

export default RepositoriesList;
