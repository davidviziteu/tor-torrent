import { lazy } from 'solid-js';
import type { RouteDefinition } from 'solid-app-router';

import Home from './pages/home';
import Error from './pages/error';
import Welcome from './pages/welcome';
import BuildingTorrent from './pages/buildingTorrent';
import NoTorrent from './pages/notorrent';
export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/error',
    component: Error
  },
  {
    path: '/welcome',
    component: Welcome
  },
  {
    path: '/build',
    component: BuildingTorrent
  },
  {
    path: '/no-torrents',
    component: NoTorrent
  },
];
