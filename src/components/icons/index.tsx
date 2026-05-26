import { IconProps, VuesaxIcon } from './Icon';

import addCircleSvg from '../../assets/icons/vuesax/linear/add-circle.svg?raw';
import archiveSvg from '../../assets/icons/vuesax/linear/archive.svg?raw';
import arrowLeftSvg from '../../assets/icons/vuesax/linear/arrow-left.svg?raw';
import arrowLeft3Svg from '../../assets/icons/vuesax/linear/arrow-left-3.svg?raw';
import arrowRight3Svg from '../../assets/icons/vuesax/linear/arrow-right-3.svg?raw';
import arrowUp3Svg from '../../assets/icons/vuesax/linear/arrow-up-3.svg?raw';
import chartSquareSvg from '../../assets/icons/vuesax/linear/chart-square.svg?raw';
import clipboardSvg from '../../assets/icons/vuesax/linear/clipboard.svg?raw';
import dangerSvg from '../../assets/icons/vuesax/linear/danger.svg?raw';
import documentSvg from '../../assets/icons/vuesax/linear/document.svg?raw';
import exportSvg from '../../assets/icons/vuesax/linear/export.svg?raw';
import filterSvg from '../../assets/icons/vuesax/linear/filter.svg?raw';
import gallerySvg from '../../assets/icons/vuesax/linear/gallery.svg?raw';
import globalEditSvg from '../../assets/icons/vuesax/linear/global-edit.svg?raw';
import importSvg from '../../assets/icons/vuesax/linear/import.svg?raw';
import infoCircleSvg from '../../assets/icons/vuesax/linear/info-circle.svg?raw';
import linkSvg from '../../assets/icons/vuesax/linear/link.svg?raw';
import locationSvg from '../../assets/icons/vuesax/linear/location.svg?raw';
import magicpenSvg from '../../assets/icons/vuesax/linear/magicpen.svg?raw';
import messageTextSvg from '../../assets/icons/vuesax/linear/message-text.svg?raw';
import pauseSvg from '../../assets/icons/vuesax/linear/pause.svg?raw';
import peopleSvg from '../../assets/icons/vuesax/linear/people.svg?raw';
import playSvg from '../../assets/icons/vuesax/linear/play.svg?raw';
import screenmirroringSvg from '../../assets/icons/vuesax/linear/screenmirroring.svg?raw';
import tickCircleSvg from '../../assets/icons/vuesax/linear/tick-circle.svg?raw';
import tickSquareSvg from '../../assets/icons/vuesax/linear/tick-square.svg?raw';
import userSvg from '../../assets/icons/vuesax/linear/user.svg?raw';

function createIcon(svg: string, displayName: string) {
  const Component = (props: Omit<IconProps, 'svg'>) => <VuesaxIcon svg={svg} {...props} />;
  Component.displayName = displayName;
  return Component;
}

export const DashboardIcon = createIcon(chartSquareSvg, 'DashboardIcon');
export const PlusCircleIcon = createIcon(addCircleSvg, 'PlusCircleIcon');
export const HistoryIcon = createIcon(archiveSvg, 'HistoryIcon');
export const SettingsIcon = createIcon(globalEditSvg, 'SettingsIcon');
export const UserIcon = createIcon(userSvg, 'UserIcon');
export const ChevronLeftIcon = createIcon(arrowLeft3Svg, 'ChevronLeftIcon');
export const ChevronRightIcon = createIcon(arrowRight3Svg, 'ChevronRightIcon');
export const PlayIcon = createIcon(playSvg, 'PlayIcon');
export const PauseIcon = createIcon(pauseSvg, 'PauseIcon');
export const TrendingUpIcon = createIcon(arrowUp3Svg, 'TrendingUpIcon');
export const CheckCircleIcon = createIcon(tickCircleSvg, 'CheckCircleIcon');
export const AlertTriangleIcon = createIcon(dangerSvg, 'AlertTriangleIcon');
export const ArrowLeftIcon = createIcon(arrowLeftSvg, 'ArrowLeftIcon');
export const CheckIcon = createIcon(tickSquareSvg, 'CheckIcon');
export const UploadIcon = createIcon(exportSvg, 'UploadIcon');
export const LinkIcon = createIcon(linkSvg, 'LinkIcon');
export const MonitorIcon = createIcon(screenmirroringSvg, 'MonitorIcon');
export const UsersIcon = createIcon(peopleSvg, 'UsersIcon');
export const MessageIcon = createIcon(messageTextSvg, 'MessageIcon');
export const AlertCircleIcon = createIcon(infoCircleSvg, 'AlertCircleIcon');
export const ListChecksIcon = createIcon(clipboardSvg, 'ListChecksIcon');
export const DownloadIcon = createIcon(importSvg, 'DownloadIcon');
export const FilterIcon = createIcon(filterSvg, 'FilterIcon');
export const TargetIcon = createIcon(locationSvg, 'TargetIcon');
export const DocumentIcon = createIcon(documentSvg, 'DocumentIcon');
export const PrototypeIcon = createIcon(magicpenSvg, 'PrototypeIcon');
export const ImageIcon = createIcon(gallerySvg, 'ImageIcon');

export type { IconProps } from './Icon';
