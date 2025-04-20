import axios from 'axios';

import { MYDEV_BASE_URL } from './helpers/constants';

export const mydev = axios.create({
  baseURL: MYDEV_BASE_URL,
});
