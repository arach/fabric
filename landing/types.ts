import React from 'react';

export interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface NavItem {
  label: string;
  href: string;
}

export enum DeploymentStage {
  LOCAL = 'LOCAL',
  CONTAINER = 'CONTAINER',
  REMOTE = 'REMOTE'
}