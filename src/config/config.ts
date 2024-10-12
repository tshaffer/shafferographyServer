import { ShafferographyConfiguration } from 'baseTypes';
import * as dotenv from 'dotenv';
import { isNil } from 'lodash';

export let shafferographyConfiguration: ShafferographyConfiguration;

export const readConfig = (pathToConfigFile: string): void => {

  try {
    const configOutput: dotenv.DotenvConfigOutput = dotenv.config({ path: pathToConfigFile });
    const parsedConfig: dotenv.DotenvParseOutput | undefined = configOutput.parsed;

    if (!isNil(parsedConfig)) {
      shafferographyConfiguration = {
        PORT: Number(parsedConfig.PORT),
        MONGO_URI: parsedConfig.MONGO_URI,
      };
      console.log(shafferographyConfiguration);
    }
  }
  catch (err) {
    console.log('Dotenv config error: ' + err.message);
  }
};
