import styled from 'styled-components'

export const Container = styled.div`
  margin: 80px 0px;
  max-width: 700px;

  .repository-item {
    display: flex;
    align-items: center;

    & + .repository-item {
      margin-top: 16px;
    }

    a {
      background: #fff;
      border-radius: 5px;
      width: 100%;
      padding: 24px;
      display: flex;
      align-items: center;
      text-decoration: none;
      transition: transform 0.2s;
      &:hover {
        transform: translateX(10px);
      }

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

    .remove-button {
      background: transparent;
      border: 0;
      margin-left: 16px;
      padding: 8px;
      color: #c53030;
      transition: color 0.2s;

      &:hover {
        color: #7d1d1d;
      }
    }
  }
`
