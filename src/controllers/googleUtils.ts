import axios from "axios";

export const getGoogleHeaders = async (googleAccessToken: string) => {

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + googleAccessToken
  };
  return headers;

};

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
      console.log('Exception in getGoogleRequest');
      console.log(err);
      return Promise.reject(err);
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
