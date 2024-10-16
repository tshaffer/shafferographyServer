import axios from "axios";
import { AuthService } from "../auth";

export const getGoogleRequest = async (googleAccessToken: string, url: string): Promise<any> => {

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + googleAccessToken
  };

  return await axios.get(
    url,
    {
      headers,
    })
    .then((response) => {
      const body: any = response.data;
      return Promise.resolve(body);
    })
    .catch((err) => {
      debugger;
    });
}

export const postGoogleRequest = async (googleAccessToken: string, url: string, data: any) => {

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + googleAccessToken
  };

  return axios.post(
    url,
    data,
    {
      headers,
    })
    .then((response: any) => {
      return Promise.resolve(response.data);
    }).catch((err: Error) => {
      debugger;
      console.log('response to axios post: ');
      console.log('err: ', err);
      return Promise.reject(err);
    });

}


export const getRequest = async (authService: AuthService, url: string): Promise<any> => {

  debugger;

  const headers = await getHeaders(authService);

  return axios.get(
    url,
    {
      headers,
    })
    .then((response) => {
      const body: any = response.data;
      return Promise.resolve(body);
    })
    .catch((err) => {
      debugger;
    });
  // request(url, { headers }, (err, resp, body) => {
  //   if (err) {
  //     return reject(`Error when GET ${url} ${err}`);
  //   }
  //   try {
  //     body = JSON.parse(body);
  //   } catch (err) {
  //     return reject(`Error parsing response body ${err}`);
  //   }
  //   if (!!body.error) {
  //     const { code, message, status } = body.error;
  //     return reject(`Error _getRequest ${url} ${code} ${message} ${status}`);
  //   }
  //   resolve(body);
  // });
};

export const postRequest = async (authService: AuthService, url: string, data: any) => {

  debugger;

  const headers = await getHeaders(authService);

  return axios.post(
    url,
    data,
    {
      headers,
    })
    .then((response: any) => {
      return Promise.resolve(response.data);
    }).catch((err: Error) => {
      debugger;
      console.log('response to axios post: ');
      console.log('err: ', err);
      return Promise.reject(err);
    });

}

export const getHeaders = async (authService: AuthService) => {

  debugger;

  const authToken = await authService.getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken.access_token}`
  };
};

