import React from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Repository } from "@/domain/models/Repository";
import { Container } from "./styles";

interface Props {
  repositories: Repository[];
  onRemoveRepository: (repository: Repository) => void;
}
const RepositoriesList: React.FC<Props> = ({
  repositories,
  onRemoveRepository,
}: Props) => {
  return (
    <Container>
      {repositories.map((repository) => {
        const { name, description, owner } = repository;

        return (
          <div key={`${owner.login}/${name}`}>
            <Link to={`/repositories/${owner.login}/${name}`}>
              <img src={owner.avatar} alt={owner.login} />
              <div>
                <strong>{name}</strong>
                <p>{description}</p>
              </div>
              <FiChevronRight size={20} />
            </Link>
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => onRemoveRepository(repository)}
            >
              <FiTrash2 size={20} />
            </button>
          </div>
        );
      })}
    </Container>
  );
};

export default RepositoriesList;
