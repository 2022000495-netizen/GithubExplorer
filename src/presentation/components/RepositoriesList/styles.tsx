import styled from 'styled-components'
import { shade } from 'polished'

export const RemoveButton = styled.button`
  margin-left: auto;
  background: transparent;
  border: 0;
  display: flex;
  align-items: center;
  padding: 8px;
  color: #cbcbd6;
  transition: color 0.2s;

  &:hover {
    color: ${shade(0.2, '#c53030')};
  }
`

export const Container = styled.div`
  margin: 80px 0px;
  max-width: 700px;

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
    > svg {
      color: #cbcbd6;

      @media (max-width: 350px) {
        display: none;
      }
    }
  }
`
