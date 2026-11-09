import useCalendar from '../useCalendar'
import AddEditEvent from './AddEditEvent'
import Calendar from './Calendar'

const CalendarPage = () => {
  const {
    eventData,
    events,
    isEditable,
    onAddEvent,
    onCloseModal,
    onDateClick,
    onDrop,
    onEventClick,
    onEventDrop,
    onRemoveEvent,
    onUpdateEvent,
    show,
  } = useCalendar()

  return (
    <div className="calendar-container">
      <div className="calendar-wrapper">
        <Calendar events={events} onDateClick={onDateClick} onDrop={onDrop} onEventClick={onEventClick} onEventDrop={onEventDrop} />
      </div>

      <AddEditEvent
        eventData={eventData}
        isEditable={isEditable}
        onAddEvent={onAddEvent}
        onRemoveEvent={onRemoveEvent}
        onUpdateEvent={onUpdateEvent}
        open={show}
        toggle={onCloseModal}
      />
    </div>
  )
}

export default CalendarPage
