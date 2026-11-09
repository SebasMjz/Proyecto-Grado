import { Icon, type IconProps } from '@iconify/react'

const IconifyIcon = (props: IconProps) => {
  return (
    <Icon
      width="1em"
      height="1em"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...props.style,
      }}
      {...props}
    />
  )
}

export default IconifyIcon
