import styled from 'styled-components'

export const Container = styled.div`
  margin: 80px 0px;
  max-width: 700px;

  .repository-item {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 5px;
    padding: 0;

    & + .repository-item {
      margin-top: 16px;
    }

    a {
      background: transparent;
      border-radius: 0;
      width: 100%;
      padding: 24px;
      display: flex;
      align-items: center;
      text-decoration: none;
      transition: transform 0.2s;
      flex: 1;

      &:hover {
        transform: translateX(10px);
      }

      img {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        flex-shrink: 0;
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
        flex-shrink: 0;

        @media (max-width: 350px) {
          display: none;
        }
      }
    }
  }
`

export const RemoveButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbcbd6;
  transition: color 0.2s, transform 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #f85652;
    transform: scale(1.2);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 350px) {
    padding: 8px 12px;
  }
`
