import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {message} from 'antd';
import API from '../api';
import WelcomePage from './WelcomePage';

jest.mock('../utils/usePageNavigation', () => ({__esModule: true, default: () => jest.fn()}));
jest.mock('../api', () => ({testConnect: jest.fn(), getProjectsInfo: jest.fn(), setProjectPinned: jest.fn()}));
jest.mock('./projectLanguageData', () => ({useLanguageCatalog: () => ({}), summaryLanguages: () => [], visibleLanguages: () => []}));
jest.mock('./FolderUploadModal/FolderUploadModal', () => () => null);
jest.mock('./GitDownModal/GitDownModal', () => () => null);

const projects = [
    {id: 'a', projectName: '应用示范案例', summaryFlag: true, source: {kind: 'upload'}, createdAt: '2026-11-01'},
    {id: 'b', projectName: '普通项目', summaryFlag: true, source: {kind: 'upload'}, createdAt: '2026-11-10'},
];
const titles = () => screen.getAllByRole('heading', {level: 3}).map(node=>node.textContent);
beforeAll(() => {
    window.matchMedia = () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(),
        addEventListener: jest.fn(), removeEventListener: jest.fn()});
});
beforeEach(() => {
    API.testConnect.mockResolvedValue({});
    API.getProjectsInfo.mockResolvedValue(projects);
    jest.spyOn(message, 'success').mockImplementation(() => {});
    jest.spyOn(message, 'error').mockImplementation(() => {});
});
afterEach(() => {jest.restoreAllMocks(); jest.clearAllMocks();});

test('pin and unpin update the card order and accessible state', async () => {
    API.setProjectPinned.mockResolvedValueOnce({...projects[0], pinnedAt: '2026-11-11T00:00:00.000001+00:00'})
        .mockResolvedValueOnce({...projects[0], pinnedAt: null});
    render(<WelcomePage/>);
    fireEvent.click(await screen.findByRole('button', {name: '应用示范案例 置顶项目'}));
    const unpin = await screen.findByRole('button', {name: '应用示范案例 取消置顶'});
    expect(unpin.getAttribute('aria-pressed')).toBe('true');
    expect(titles()).toEqual(['应用示范案例', '普通项目']);
    expect(API.setProjectPinned).toHaveBeenCalledWith('a', true);
    await waitFor(() => expect(unpin.classList.contains('ant-btn-loading')).toBe(false));
    expect(unpin.querySelector('[aria-label="pushpin"] svg').style.transform).toBe('rotate(-45deg)');
    fireEvent.click(unpin);
    const pin = await screen.findByRole('button', {name: '应用示范案例 置顶项目'});
    await waitFor(() => expect(pin.classList.contains('ant-btn-loading')).toBe(false));
    expect(pin.querySelector('[aria-label="pushpin"] svg').style.transform).toBe('');
    expect(titles()).toEqual(['普通项目', '应用示范案例']);
    expect(API.setProjectPinned).toHaveBeenLastCalledWith('a', false);
});

test('failed pin leaves state and ordering unchanged', async () => {
    API.setProjectPinned.mockRejectedValueOnce(new Error('网络失败'));
    render(<WelcomePage/>);
    fireEvent.click(await screen.findByRole('button', {name: '应用示范案例 置顶项目'}));
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('网络失败'));
    expect(titles()).toEqual(['普通项目', '应用示范案例']);
    expect(screen.queryByRole('button', {name: '应用示范案例 取消置顶'})).toBeNull();
});

test('loaded pins show the most recently pinned project first', async () => {
    API.getProjectsInfo.mockResolvedValueOnce([
        {...projects[0], pinnedAt: '2026-11-11T00:00:00.000002+00:00'},
        {...projects[1], pinnedAt: '2026-11-11T00:00:00.000001+00:00'},
    ]);
    render(<WelcomePage/>);
    await screen.findByRole('button', {name: '应用示范案例 取消置顶'});
    expect(titles()).toEqual(['应用示范案例', '普通项目']);
});
