import styled from 'styled-components'

export const Container = styled.div`
  margin: 80px 0px;
  max-width: 700px;

  .repository-item {
    display: flex;
    align-items: center;
    gap: 8px;

    & + .repository-item {
      margin-top: 16px;
    }

    a {
      background: #fff;
      border-radius: 5px;
      flex: 1;
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
  }
`

export const RemoveButton = styled.button`
  background: #fff;
  border: none;
  border-radius: 5px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a8a8b3;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #d62828;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`
