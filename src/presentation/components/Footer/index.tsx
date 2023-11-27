import React from "react";
import { FiLinkedin } from "react-icons/fi";
import { Container } from "./styles";

const Footer: React.FC = () => {
  return (
    <Container>
      <a href="#">
        <FiLinkedin />
        <p data-testid="author">Matheus</p>
      </a>
    </Container>
  );
};

export default Footer;
