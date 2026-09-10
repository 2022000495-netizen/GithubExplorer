import styled from "styled-components";

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;

  a {
    display: flex;
    align-items: center;
    text-decoration: none;
    font-weight: bold;
    color: #a8a8b3;
    transition: color 0.2s;
    &:hover {
      color: #666;
    }

    svg {
      margin-right: 4px;
    }
  }
`;

export const RespositoryInfo = styled.section`
  margin-top: 80px;

  header {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
    }

    div {
      margin-left: 24px;

      strong {
        font-size: 36px;
        color: #3d3d4d;
      }

      p {
        font-size: 18px;
        color: #737380;
        margin-top: 4px;
      }
    }
  }

  ul {
    display: flex;
    list-style: none;
    margin-top: 40px;

    li {
      & + li {
        margin-left: 80px;
      }

      strong {
        display: block;
        font-size: 36px;
        color: #3d3d4d;
      }

      span {
        display: block;
        margin-top: 4px;
        color: #6c6c80;
      }
    }
    @media (max-width: 600px) {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 150px));
      place-content: center;
      gap: 10px;

      li {
        justify-items: center;
        & + li {
          margin-left: 0px;
        }
      }
    }
  }

  @media (max-width: 500px) {
    header {
      display: grid;
      justify-items: center;
      flex-wrap: wrap;
      flex-flow: column;
      justify-items: center;
      align-self: center;
      gap: 16px;
      place-content: center;
      text-align: start;

      div {
        strong {
          font-size: 26px;
        }
        p {
          font-size: 16px;
        }
      }
    }
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 80px;
  margin-bottom: 32px;
  border-bottom: 1px solid #ebeef0;
  max-width: 700px;
`;

export const TabButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.active ? "#3d3d4d" : "#a8a8b3")};
  cursor: pointer;
  transition: color 0.2s;
  border-bottom: 3px solid ${(props) => (props.active ? "#0969da" : "transparent")};
  margin-bottom: -1px;

  &:hover {
    color: #3d3d4d;
  }

  & + button {
    margin-left: 32px;
  }
`;

export const TabContent = styled.div`
  max-width: 700px;
`;

export const Issues = styled.div`
  margin: 0px 0px;
  max-width: 700px;

  p {
    padding: 24px;
    color: #a8a8b3;
    font-size: 16px;
  }

  a {
    background: #fff;
    border-radius: 5px;
    width: 100%;
    padding: 24px;
    display: block;
    text-decoration: none;
    display: flex;
    align-items: center;
    transition: transform 0.2s;
    &:hover {
      transform: translateX(10px);
    }
    & + a {
      margin-top: 16px;
    }

    div {
      margin: 0px 16px;
      flex: 1;

      strong {
        font-size: 20px;
        color: #3d3d4d;
        word-break: break-all;
      }
      p {
        font-size: 18px;
        color: #a8a8b3;
        margin-top: 4px;
        margin: 4px 0 0 0;
        padding: 0;
      }
    }
    svg {
      margin-left: auto;
      color: #cbcbd6;
    }
  }
`;
