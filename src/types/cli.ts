import { HintedString } from './helpers';
import { BuildEnvironmentOptions, LogLevel } from 'vite';

export type CLIBuildMode = HintedString<'production' | 'development'>;

export interface GlobalCLIOptions {
  '--'?: string[];
  'c'?: boolean | string;
  'config'?: string;
  'base'?: string;
  'l'?: LogLevel;
  'logLevel'?: LogLevel;
  'clearScreen'?: boolean;
  'configLoader'?: 'bundle' | 'runner' | 'native';
  'd'?: boolean | string;
  'debug'?: boolean | string;
  'f'?: string;
  'filter'?: string;
  'm'?: string;
  'mode'?: CLIBuildMode;
  'force'?: boolean;
  'w'?: boolean;
}

export interface BuilderCLIOptions {
  app?: boolean;
}

export type CLIBuildOptions = BuildEnvironmentOptions & BuilderCLIOptions & GlobalCLIOptions;
