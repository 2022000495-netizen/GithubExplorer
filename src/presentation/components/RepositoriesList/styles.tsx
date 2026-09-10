import styled from 'styled-components'

export const Container = styled.div`
  margin: 80px 0px;
  max-width: 700px;

  > div {
    background: #fff;
    border-radius: 5px;
    width: 100%;
    padding: 24px;
    display: flex;
    align-items: center;
    transition: transform 0.2s;
    &:hover {
      transform: translateX(10px);
    }
    & + div {
      margin-top: 16px;
    }
  }

  a {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    text-decoration: none;

    img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      @media (max-width: 460px) {
        display: none;
      }
    }

    div {
      margin: 0px 16px;
      flex: 1;

      strong {
        font-size: 20px;
        color: #3d3d4d;
      }
      p {
        font-size: 18px;
        color: #a8a8b3;
        margin-top: 4px;
      }

      @media (max-width: 600px) {
        strong,
        p {
          font-size: 16px;
        }
      }
    }
    svg {
      margin-left: auto;
      color: #cbcbd6;

      @media (max-width: 350px) {
        display: none;
      }
    }
  }

  button {
    background: transparent;
    border: 0;
    margin-left: 16px;
    padding: 8px;
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
      color: #cbcbd6;
      transition: color 0.2s;
    }

    &:hover svg {
      color: #e83f5b;
    }
  }
`
